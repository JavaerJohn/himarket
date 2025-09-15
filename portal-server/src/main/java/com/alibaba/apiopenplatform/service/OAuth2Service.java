package com.alibaba.apiopenplatform.service;

import com.alibaba.apiopenplatform.dto.result.AuthResult;

/**
 * @author zh
 */
public interface OAuth2Service {

    /**
     * JWT Bearer认证
     *
     * @param grantType
     * @param jwtToken
     * @return
     */
    AuthResult authenticate(String grantType, String jwtToken);

}
