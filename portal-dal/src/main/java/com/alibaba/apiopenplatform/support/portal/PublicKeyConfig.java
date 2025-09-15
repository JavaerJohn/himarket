package com.alibaba.apiopenplatform.support.portal;

import com.alibaba.apiopenplatform.support.enums.PublicKeyFormat;
import lombok.Data;

/**
 * @author zh
 */
@Data
public class PublicKeyConfig {

    /**
     * 公钥ID
     */
    private String kid;

    /**
     * 公钥格式：PEM或JWK
     */
    private PublicKeyFormat format;

    /**
     * 签名算法：RS256，ES256，PS256等
     */
    private String algorithm;

    /**
     * 公钥内容，PEM或JWK JSON字符串
     */
    private String value;
}
