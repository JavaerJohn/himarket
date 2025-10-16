package com.alibaba.apiopenplatform.dto.params.product;

import com.alibaba.apiopenplatform.support.enums.SubscriptionStatus;
import lombok.Data;

/**
 * @author zh
 */
@Data
public class QueryProductSubscriptionParam {

    private SubscriptionStatus status;

    private String consumerName;
}
