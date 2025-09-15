package com.alibaba.apiopenplatform.dto.result;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IdpState {

    /**
     * 提供商标识
     */
    private String provider;

    /**
     * 时间戳
     */
    private Long timestamp;

    /**
     * 随机数（防重放）
     */
    private String nonce;

    /**
     * HiMarket-Frontend应用的API前缀
     */
    private String apiPrefix;
}
