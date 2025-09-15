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

import cn.hutool.core.util.StrUtil;
import com.alibaba.apiopenplatform.core.constant.Resources;
import com.alibaba.apiopenplatform.core.security.ContextHolder;
import com.alibaba.apiopenplatform.core.utils.TokenUtil;
import com.alibaba.apiopenplatform.dto.result.AdminResult;
import com.alibaba.apiopenplatform.dto.result.AuthResult;
import com.alibaba.apiopenplatform.entity.Administrator;
import com.alibaba.apiopenplatform.repository.AdministratorRepository;
import com.alibaba.apiopenplatform.service.AdministratorService;
import com.alibaba.apiopenplatform.core.utils.PasswordHasher;
import com.alibaba.apiopenplatform.core.utils.IdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.alibaba.apiopenplatform.core.exception.BusinessException;
import com.alibaba.apiopenplatform.core.exception.ErrorCode;

@Service
@RequiredArgsConstructor
@Transactional
public class AdministratorServiceImpl implements AdministratorService {

    private final AdministratorRepository administratorRepository;

    private final ContextHolder contextHolder;

    @Override
    public AuthResult login(String username, String password) {
        Administrator admin = administratorRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, Resources.ADMINISTRATOR, username));

        if (!PasswordHasher.verify(password, admin.getPasswordHash())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "用户名或密码错误");
        }

        String token = TokenUtil.generateAdminToken(admin.getAdminId());
        return AuthResult.of(token, TokenUtil.getTokenExpiresIn());
    }

    @Override
    public boolean needInit() {
        return administratorRepository.count() == 0;
    }

    @Override
    public AdminResult initAdmin(String username, String password) {
        Administrator admin = Administrator.builder()
                .adminId(generateAdminId())
                .username(username)
                .passwordHash(PasswordHasher.hash(password))
                .build();
        administratorRepository.save(admin);
        return new AdminResult().convertFrom(admin);
    }

    @Override
    public AdminResult getAdministrator() {
        Administrator administrator = findAdministrator(contextHolder.getUser());
        return new AdminResult().convertFrom(administrator);
    }

    @Override
    @Transactional
    public void resetPassword(String oldPassword, String newPassword) {
        Administrator admin = findAdministrator(contextHolder.getUser());

        if (!PasswordHasher.verify(oldPassword, admin.getPasswordHash())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "用户名或密码错误");
        }

        admin.setPasswordHash(PasswordHasher.hash(newPassword));
        administratorRepository.save(admin);
    }

    private String generateAdminId() {
        return IdGenerator.genAdministratorId();
    }

    private Administrator findAdministrator(String adminId) {
        return administratorRepository.findByAdminId(adminId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, Resources.ADMINISTRATOR, adminId));
    }
} 