package com.alibaba.apiopenplatform.support.enums;

import lombok.Getter;

/**
 * @author zh
 */
@Getter
public enum APIGResourceType {

    RestApiOperation("RestApiOperation"),

    MCP("MCP"),

    Agent("Agent"),

    LLM("LLM"),

    ;

    APIGResourceType(String type) {
        this.type = type;
    }

    private final String type;
}
