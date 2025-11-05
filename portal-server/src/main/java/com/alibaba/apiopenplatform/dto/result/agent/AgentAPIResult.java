package com.alibaba.apiopenplatform.dto.result.agent;

import lombok.Builder;
import lombok.Data;

/**
 * @author zh
 */
@Data
@Builder
public class AgentAPIResult {

    private String agentApiId;

    private String agentApiName;
}
