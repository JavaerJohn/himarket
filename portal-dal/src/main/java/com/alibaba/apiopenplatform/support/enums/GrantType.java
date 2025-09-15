package com.alibaba.apiopenplatform.support.enums;

import lombok.Getter;

/**
 * @author zh
 */
@Getter
public enum GrantType {

    /**
     * 授权码模式
     */
    AUTHORIZATION_CODE("authorization_code"),


    /**
     * JWT断言，OAuth2.0标准拓展
     */
    JWT_BEARER("urn:ietf:params:oauth:grant-type:jwt-bearer"),

    ;

    private final String type;

    GrantType(String type) {
        this.type = type;
    }
}
