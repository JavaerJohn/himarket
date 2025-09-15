package com.alibaba.apiopenplatform.support.portal;

import lombok.Data;

import java.util.List;

/**
 * @author zh
 */
@Data
public class JwtBearerConfig {

    /**
     * JWT公钥
     */
    private List<PublicKeyConfig> publicKeys;
}
