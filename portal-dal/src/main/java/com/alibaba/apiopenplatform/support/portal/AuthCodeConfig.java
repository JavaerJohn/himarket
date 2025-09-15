package com.alibaba.apiopenplatform.support.portal;

import lombok.Data;

/**
 * @author zh
 */
@Data
public class AuthCodeConfig {

    /**
     * 凭证
     */
    private String clientId;
    private String clientSecret;

    /**
     * 访问范围
     */
    private String scopes;

    /**
     * Issuer
     */
    private String issuer;

    /**
     * 授权端点
     */
    private String authorizationEndpoint;

    /**
     * 令牌端点
     */
    private String tokenEndpoint;

    /**
     * 用户信息端点
     */
    private String userInfoEndpoint;

    /**
     * JWK Set URI
     */
    private String jwkSetUri;

    /**
     * 重定向URI
     */
    private String redirectUri;
}
