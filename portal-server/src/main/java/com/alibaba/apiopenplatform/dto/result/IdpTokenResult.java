package com.alibaba.apiopenplatform.dto.result;

import cn.hutool.core.annotation.Alias;
import lombok.Data;

@Data
public class IdpTokenResult {

    /**
     * 访问令牌
     */
    @Alias("access_token")
    private String accessToken;

    /**
     * ID令牌
     */
    @Alias("id_token")
    private String idToken;

    /**
     * 刷新令牌
     */
    @Alias("refresh_token")
    private String refreshToken;

    /**
     * 令牌类型
     */
    @Alias("token_type")
    private String tokenType;

    /**
     * 过期时间（秒）
     */
    @Alias("expires_in")
    private Integer expiresIn;

    /**
     * 范围
     */
    private String scope;
}
