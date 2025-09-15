package com.alibaba.apiopenplatform.support.enums;

/**
 * @author zh
 */
public enum DeveloperAuthType {

    @Deprecated
    LOCAL,

    BUILTIN,

    @Deprecated
    EXTERNAL,

    OIDC,

    OAUTH2,

    ;

    public boolean isBuiltIn() {
        return this == BUILTIN || this == LOCAL;
    }
}
