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


package com.alibaba.apiopenplatform.service.gateway.client;

import com.aliyun.sdk.service.sls20201230.*;
import com.aliyun.auth.credentials.Credential;
import com.aliyun.auth.credentials.provider.StaticCredentialProvider;
import darabonba.core.client.ClientOverrideConfiguration;
import lombok.extern.slf4j.Slf4j;
import com.alibaba.apiopenplatform.support.gateway.APIGConfig;
import com.alibaba.apiopenplatform.core.exception.BusinessException;
import com.alibaba.apiopenplatform.core.exception.ErrorCode;

import java.util.function.Function;

@Slf4j
public class SLSClient {
    private final AsyncClient slsClient;

    public SLSClient(APIGConfig config,boolean forTicket) {
        if (forTicket) {
            this.slsClient = createTicketClient(config);
        } else {
            this.slsClient = createClient(config);
        }
    }

    public void close() {
        if (slsClient != null) {
            slsClient.close();
        }
    }

    public <E> E execute(Function<AsyncClient, E> function) {
        try {
            return function.apply(slsClient);
        } catch (Exception e) {
            log.error("Error executing SLS request", e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, e.getMessage());
        }
    }

    private AsyncClient createClient(APIGConfig config) {
        // noinspection AklessInspection
        StaticCredentialProvider provider = StaticCredentialProvider.create(Credential.builder()
                .accessKeyId(config.getAccessKey())
                .accessKeySecret(config.getSecretKey())
                .build());
        String endpoint = String.format("%s.log.aliyuncs.com", config.getRegion());
        return AsyncClient.builder()
                .region(config.getRegion())
                .credentialsProvider(provider)
                .overrideConfiguration(
                        ClientOverrideConfiguration.create()
                                .setEndpointOverride(endpoint)
                ).build();
    }
    private AsyncClient createTicketClient(APIGConfig config) {
        StaticCredentialProvider provider = StaticCredentialProvider.create(Credential.builder()
                .accessKeyId(config.getAccessKey())
                .accessKeySecret(config.getSecretKey())
                .build());
        return AsyncClient.builder()
                .region("cn-shanghai")
                .credentialsProvider(provider)
                .overrideConfiguration(
                        ClientOverrideConfiguration.create()
                                .setEndpointOverride("cn-shanghai.log.aliyuncs.com")
                ).build();
    }
}
