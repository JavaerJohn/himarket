package com.alibaba.apiopenplatform.dto.params.gateway;

import com.alibaba.apiopenplatform.support.enums.GatewayType;
import lombok.Data;

/**
 * @author zh
 */
@Data
public class QueryGatewayParam {

    private GatewayType gatewayType;
}
