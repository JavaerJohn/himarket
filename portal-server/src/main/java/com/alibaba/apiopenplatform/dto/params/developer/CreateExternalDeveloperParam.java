package com.alibaba.apiopenplatform.dto.params.developer;

import com.alibaba.apiopenplatform.dto.converter.InputConverter;
import com.alibaba.apiopenplatform.entity.DeveloperExternalIdentity;
import com.alibaba.apiopenplatform.support.enums.DeveloperAuthType;
import lombok.Builder;
import lombok.Data;

/**
 * @author zh
 */
@Data
@Builder
public class CreateExternalDeveloperParam implements InputConverter<DeveloperExternalIdentity> {

    private String provider;

    private String subject;

    private String displayName;

    private String email;

    private DeveloperAuthType authType;
}
