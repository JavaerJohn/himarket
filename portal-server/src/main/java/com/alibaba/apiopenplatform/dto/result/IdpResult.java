package com.alibaba.apiopenplatform.dto.result;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IdpResult {

    /**
     * 提供商标识
     */
    private String provider;

    /**
     * 提供商名称
     */
    private String displayName;
}
