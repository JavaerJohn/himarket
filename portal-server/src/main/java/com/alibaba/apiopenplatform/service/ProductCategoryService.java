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

package com.alibaba.apiopenplatform.service;

import com.alibaba.apiopenplatform.dto.params.category.*;
import com.alibaba.apiopenplatform.dto.params.category.CreateProductCategoryParam;
import com.alibaba.apiopenplatform.dto.result.PageResult;
import com.alibaba.apiopenplatform.dto.result.ProductCategoryResult;

import java.util.List;

import org.springframework.data.domain.Pageable;

public interface ProductCategoryService {

    /**
     * Create a product category.
     *
     * @param param
     * @return
     */
    ProductCategoryResult createProductCategory(CreateProductCategoryParam param);

    /**
     * List all product categories.
     *
     * @param param
     * @param pageable
     * @return
     */
    PageResult<ProductCategoryResult> listProductCategories(QueryProductCategoryParam param, Pageable pageable);

    /**
     * Delete a product category.
     *
     * @param categoryId
     */
    void deleteProductCategory(String categoryId);

    /**
     * Get the detailed information of a product category.
     *
     * @param categoryId
     * @return
     */
    ProductCategoryResult getProductCategory(String categoryId);

    /**
     * Update a product category.
     *
     * @param categoryId
     * @param param
     * @return
     */
    ProductCategoryResult updateProductCategory(String categoryId, UpdateProductCategoryParam param);

    /**
     * List all product categories for a product.
     *
     * @param productId
     * @return
     */
    List<ProductCategoryResult> listCategoriesForProduct(String productId);

    /**
     * Bind product categories to a product.
     *
     * @param productId
     * @param categoryIds
     */
    void bindProductCategories(String productId, List<String> categoryIds);

    /**
     * Unbind product categories from a product.
     *
     * @param productId
     */
    void unbindProductCategories(String productId);
}