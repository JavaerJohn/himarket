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

package com.alibaba.apiopenplatform.dto.result.nacos;

import com.alibaba.apiopenplatform.dto.converter.OutputConverter;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Nacos 命名空间结果
 */
@EqualsAndHashCode(callSuper = false)
@Data
public class NacosNamespaceResult implements OutputConverter<NacosNamespaceResult, Object> {

    private String namespaceId;
    private String namespaceName;
    private String namespaceDesc;

    @Override
    public NacosNamespaceResult convertFrom(Object source) {
        // 兼容不同SDK类型的命名空间对象，尽可能抽取常见字段
        if (source == null) {
            return this;
        }
        try {
            // 优先通过常见getter获取
            String id = invokeGetter(source, "getNamespaceId", "getNamespace", "getId");
            String name = invokeGetter(source, "getNamespaceShowName", "getNamespaceName", "getName");
            String desc = invokeGetter(source, "getNamespaceDesc", "getDescription", "getDesc");
            this.namespaceId = id != null ? id : this.namespaceId;
            this.namespaceName = name != null ? name : this.namespaceName;
            this.namespaceDesc = desc != null ? desc : this.namespaceDesc;
        } catch (Exception ignore) {
            // 回退到通用属性复制
            OutputConverter.super.convertFrom(source);
        }
        return this;
    }

    private String invokeGetter(Object obj, String... methods) {
        for (String m : methods) {
            try {
                java.lang.reflect.Method method = obj.getClass().getMethod(m);
                Object val = method.invoke(obj);
                if (val != null) {
                    return String.valueOf(val);
                }
            } catch (Exception e) {
                // ignore and continue
            }
        }
        return null;
    }
}
