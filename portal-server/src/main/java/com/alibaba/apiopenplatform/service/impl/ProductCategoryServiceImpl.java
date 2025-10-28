/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package com.alibaba.apiopenplatform.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import com.alibaba.apiopenplatform.core.constant.Resources;
import com.alibaba.apiopenplatform.core.exception.BusinessException;
import com.alibaba.apiopenplatform.core.exception.ErrorCode;
import com.alibaba.apiopenplatform.core.utils.IdGenerator;
import com.alibaba.apiopenplatform.dto.params.category.QueryProductCategoryParam;
import com.alibaba.apiopenplatform.dto.params.category.UpdateProductCategoryParam;
import com.alibaba.apiopenplatform.dto.params.category.CreateProductCategoryParam;
import com.alibaba.apiopenplatform.dto.result.ProductCategoryResult;
import com.alibaba.apiopenplatform.dto.result.PageResult;
import com.alibaba.apiopenplatform.dto.result.ProductResult;
import com.alibaba.apiopenplatform.entity.ProductCategory;
import com.alibaba.apiopenplatform.entity.ProductCategoryRelation;
import com.alibaba.apiopenplatform.repository.ProductCategoryRelationRepository;
import com.alibaba.apiopenplatform.repository.ProductCategoryRepository;
import com.alibaba.apiopenplatform.service.ProductCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProductCategoryServiceImpl implements ProductCategoryService {

    private final ProductCategoryRepository categoryRepository;

    private final ProductCategoryRelationRepository categoryRelationRepository;

    @Override
    public ProductCategoryResult createProductCategory(CreateProductCategoryParam param) {
        categoryRepository.findByName(param.getName())
                .ifPresent(category -> {
                    throw new BusinessException(ErrorCode.CONFLICT,
                            StrUtil.format("Product category {} already exists", category.getName()));
                });

        String categoryId = IdGenerator.genCategoryId();

        ProductCategory category = param.convertTo();
        category.setCategoryId(categoryId);

        categoryRepository.save(category);

        return getProductCategory(categoryId);
    }

    @Override
    public PageResult<ProductCategoryResult> listProductCategories(QueryProductCategoryParam param, Pageable pageable) {
        Page<ProductCategory> categories = categoryRepository.findAll(buildProductCategorySpec(param), pageable);
        return new PageResult<ProductCategoryResult>().convertFrom(categories,
                category -> new ProductCategoryResult().convertFrom(category));
    }

    @Override
    public ProductCategoryResult getProductCategory(String categoryId) {
        ProductCategory category = findCategory(categoryId);
        return new ProductCategoryResult().convertFrom(category);
    }

    @Override
    public ProductCategoryResult updateProductCategory(String categoryId, UpdateProductCategoryParam param) {
        ProductCategory category = findCategory(categoryId);

        Optional.ofNullable(param.getName())
                .filter(name -> !name.equals(category.getName()))
                .flatMap(categoryRepository::findByName)
                .ifPresent(p -> {
                    throw new BusinessException(ErrorCode.CONFLICT,
                            StrUtil.format("Product category {} already exists", category.getName()));
                });

        param.update(category);
        categoryRepository.saveAndFlush(category);

        return getProductCategory(categoryId);
    }

    @Override
    public void deleteProductCategory(String categoryId) {
        ProductCategory category = findCategory(categoryId);
        if (categoryRelationRepository.existsByCategoryId(categoryId)) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST,
                    StrUtil.format("Product category '{}' is in use", category.getName()));
        }

        categoryRepository.delete(category);
    }

    @Override
    public List<ProductCategoryResult> listCategoriesForProduct(String productId) {
        List<ProductCategoryRelation> relations = categoryRelationRepository.findByProductId(productId);
        if (CollUtil.isEmpty(relations)) {
            return CollUtil.newArrayList();
        }

        List<String> categoryIds = relations.stream()
                .map(ProductCategoryRelation::getCategoryId)
                .collect(Collectors.toList());

        return categoryRepository.findByCategoryIdIn(categoryIds).stream()
                .map(category -> new ProductCategoryResult().convertFrom(category))
                .collect(Collectors.toList());
    }

    @Override
    public void bindProductCategories(String productId, List<String> categoryIds) {
        if (CollUtil.isEmpty(categoryIds)) {
            return;
        }

        categoryIds = categoryRepository.findByCategoryIdIn(categoryIds).stream()
                .map(ProductCategory::getCategoryId)
                .collect(Collectors.toList());

        Set<String> existedRelations = categoryRelationRepository.findByProductId(productId).stream()
                .map(ProductCategoryRelation::getCategoryId)
                .collect(Collectors.toSet());

        List<ProductCategoryRelation> relations = categoryIds.stream()
                // filter out existed relations
                .filter(categoryId -> !existedRelations.contains(categoryId))
                .map(categoryId -> {
                    ProductCategoryRelation relation = new ProductCategoryRelation();
                    relation.setProductId(productId);
                    relation.setCategoryId(categoryId);
                    return relation;
                })
                .collect(Collectors.toList());

        if (CollUtil.isNotEmpty(relations)) {
            categoryRelationRepository.saveAll(relations);
        }
    }

    @Override
    public void unbindProductCategories(String productId) {
        categoryRelationRepository.deleteAllByProductId(productId);
    }

    private ProductCategory findCategory(String categoryId) {
        return categoryRepository.findByCategoryId(categoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, Resources.PRODUCT_CATEGORY, categoryId));
    }

    private Specification<ProductCategory> buildProductCategorySpec(QueryProductCategoryParam param) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StrUtil.isNotBlank(param.getName())) {
                String likePattern = "%" + param.getName().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("name")), likePattern));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}