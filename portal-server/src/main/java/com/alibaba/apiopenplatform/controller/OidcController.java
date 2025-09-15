package com.alibaba.apiopenplatform.controller;

import com.alibaba.apiopenplatform.dto.result.AuthResult;
import com.alibaba.apiopenplatform.dto.result.IdpResult;
import com.alibaba.apiopenplatform.service.OidcService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/developers/oidc")
@RequiredArgsConstructor
public class OidcController {

    private final OidcService oidcService;

    @GetMapping("/authorize")
    public void authorize(@RequestParam String provider,
                          @RequestParam(defaultValue = "/api/v1") String apiPrefix,
                          HttpServletRequest request,
                          HttpServletResponse response) throws IOException {
        String authUrl = oidcService.buildAuthorizationUrl(provider, apiPrefix, request);

        log.info("Redirecting to OIDC authorization URL: {}", authUrl);
        response.sendRedirect(authUrl);
    }

    @GetMapping("/callback")
    public AuthResult callback(@RequestParam String code,
                               @RequestParam String state,
                               HttpServletRequest request,
                               HttpServletResponse response) {
        return oidcService.handleCallback(code, state, request, response);
    }

    @GetMapping("/providers")
    public List<IdpResult> getProviders() {
        return oidcService.getAvailableProviders();
    }
}
