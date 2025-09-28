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

package com.alibaba.apiopenplatform.dto.result;

import com.alibaba.apiopenplatform.dto.converter.OutputConverter;
import com.aliyun.sdk.service.apig20240327.models.HttpRoute;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class APIGMCPServerResult extends GatewayMCPServerResult implements OutputConverter<APIGMCPServerResult, HttpRoute> {

    private String apiId;

    private String mcpServerId;

    private String mcpRouteId;

    @Override
    public APIGMCPServerResult convertFrom(HttpRoute httpRoute) {
        APIGMCPServerResult r = OutputConverter.super.convertFrom(httpRoute);
        r.setMcpServerName(httpRoute.getName());
        r.setMcpRouteId(httpRoute.getRouteId());
        return r;
    }
}
