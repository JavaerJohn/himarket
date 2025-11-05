package com.alibaba.apiopenplatform.dto.result.agent;

import com.alibaba.apiopenplatform.dto.result.httpapi.HttpRouteResult;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * @author zh
 */
@Data
public class AgentConfigResult {

    private AgentAPIConfig agentAPIConfig;

    @Data
    @Builder
    public static class AgentAPIConfig {
        /**
         * for AI gateway
         */
        private List<String> agentProtocols;
        private List<HttpRouteResult> routes;
    }
}

