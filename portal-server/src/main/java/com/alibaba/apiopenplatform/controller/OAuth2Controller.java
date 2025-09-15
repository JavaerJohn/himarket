package com.alibaba.apiopenplatform.controller;

import com.alibaba.apiopenplatform.dto.result.AuthResult;
import com.alibaba.apiopenplatform.service.OAuth2Service;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author zh
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/developers/oauth2")
public class OAuth2Controller {

    private final OAuth2Service oAuth2Service;

    @PostMapping("/token")
    public AuthResult authenticate(@RequestParam("grant_type") String grantType,
                                   @RequestParam("assertion") String assertion) {
        return oAuth2Service.authenticate(grantType, assertion);
    }
}
