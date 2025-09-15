package com.alibaba.apiopenplatform.support.portal;

import com.alibaba.apiopenplatform.support.enums.GrantType;
import lombok.Data;

/**
 * @author zh
 */
@Data
public class OAuth2Config {

    /**
     * 提供商
     */
    private String provider;

    /**
     * 名称
     */
    private String name;

    /**
     * 是否启用
     */
    private boolean enabled = true;

    /**
     * 授权模式
     */
    private GrantType grantType;

    /**
     * JWT断言配置
     */
    private JwtBearerConfig jwtBearerConfig;

    /**
     * 身份映射
     */
    private IdentityMapping identityMapping = new IdentityMapping();

}
