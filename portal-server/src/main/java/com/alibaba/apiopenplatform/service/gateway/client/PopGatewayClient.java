package com.alibaba.apiopenplatform.service.gateway.client;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.alibaba.apiopenplatform.support.gateway.APIGConfig;
import com.aliyuncs.CommonRequest;
import com.aliyuncs.CommonResponse;
import com.aliyuncs.DefaultAcsClient;
import com.aliyuncs.IAcsClient;
import com.aliyuncs.exceptions.ClientException;
import com.aliyuncs.http.MethodType;
import com.aliyuncs.http.ProtocolType;
import com.aliyuncs.profile.DefaultProfile;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.function.Function;

/**
 * @author zh
 * 通用SDK客户端，解决OpenAPI未开放问题
 */
@Slf4j
public class PopGatewayClient extends GatewayClient {

    private final APIGConfig config;

    private final IAcsClient client;

    public PopGatewayClient(APIGConfig config) {
        this.config = config;
        this.client = createClient(config);
    }

    private IAcsClient createClient(APIGConfig config) {
        DefaultProfile profile = DefaultProfile.getProfile(
                config.getRegion(),
                config.getAccessKey(),
                config.getSecretKey());
        return new DefaultAcsClient(profile);
    }

    @Override
    public void close() {
        client.shutdown();
    }

    public <E> E execute(String uri, MethodType methodType, Map<String, String> queryParams,
                         Function<JSONObject, E> converter) {

        // CommonRequest
        CommonRequest request = new CommonRequest();
        request.setSysProtocol(ProtocolType.HTTPS);
        request.setSysDomain(getAPIGEndpoint(config.getRegion()));
        request.setSysVersion("2024-03-27");
        request.setSysUriPattern(uri);
        request.setSysMethod(methodType);

        // Query Parameters
        if (queryParams != null) {
            for (Map.Entry<String, String> entry : queryParams.entrySet()) {
                request.putQueryParameter(entry.getKey(), entry.getValue());
            }
        }

        try {
            CommonResponse response = client.getCommonResponse(request);
            JSONObject data = JSONUtil.parseObj(response.getData())
                    .getJSONObject("data");

            return converter.apply(data);
        } catch (ClientException e) {
            log.error("Error executing Pop request", e);
            throw new RuntimeException(e);
        }
    }
}
