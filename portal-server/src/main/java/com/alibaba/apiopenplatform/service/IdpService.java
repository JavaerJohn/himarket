package com.alibaba.apiopenplatform.service;

import com.alibaba.apiopenplatform.support.enums.PublicKeyFormat;
import com.alibaba.apiopenplatform.support.portal.OAuth2Config;
import com.alibaba.apiopenplatform.support.portal.OidcConfig;

import java.security.PublicKey;
import java.util.List;

/**
 * @author zh
 */
public interface IdpService {

    /**
     * 验证OIDC配置
     *
     * @param oidcConfigs
     */
    void validateOidcConfigs(List<OidcConfig> oidcConfigs);

    /**
     * 验证OAuth2配置
     *
     * @param oauth2Configs
     */
    void validateOAuth2Configs(List<OAuth2Config> oauth2Configs);

    /**
     * 加载JWT公钥
     *
     * @param format
     * @param publicKey
     * @return
     */
    PublicKey loadPublicKey(PublicKeyFormat format, String publicKey);
}
