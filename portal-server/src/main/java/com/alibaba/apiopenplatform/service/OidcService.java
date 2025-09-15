package com.alibaba.apiopenplatform.service;

import com.alibaba.apiopenplatform.dto.result.AuthResult;
import com.alibaba.apiopenplatform.dto.result.IdpResult;
import com.alibaba.apiopenplatform.support.portal.OidcConfig;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;

public interface OidcService {

    /**
     * 重定向到授权服务器
     *
     * @param provider
     * @param apiPrefix
     * @param request
     * @return
     */
    String buildAuthorizationUrl(String provider, String apiPrefix, HttpServletRequest request);

    /**
     * 授权服务器回调
     *
     * @param code
     * @param state
     * @param request
     * @param response
     * @return
     */
    AuthResult handleCallback(String code, String state, HttpServletRequest request, HttpServletResponse response);

    /**
     * 可用的OIDC认证列表
     *
     * @return
     */
    List<IdpResult> getAvailableProviders();

}
