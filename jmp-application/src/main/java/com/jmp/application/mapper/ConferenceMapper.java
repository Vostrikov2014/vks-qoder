package com.jmp.application.mapper;

import com.jmp.domain.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.jmp.application.dto.ConferenceDto;
import com.jmp.domain.entity.AccessPolicy;
import com.jmp.domain.entity.Conference;

/**
 * MapStruct mapper for Conference entity and DTOs.
 * Per specification §4.5, §14.2
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface ConferenceMapper {

    @Mapping(target = "tenantId", source = "tenant.id")
    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByName", source = "createdBy", qualifiedByName = "userToName")
    @Mapping(target = "currentParticipants", expression = "java(conference.getCurrentParticipantCount())")
    @Mapping(target = "accessPolicy", source = "accessPolicy", qualifiedByName = "accessPolicyToString")
    @Mapping(target = "assignedCount", expression = "java(conference.getAssignments() != null && org.hibernate.Hibernate.isInitialized(conference.getAssignments()) ? conference.getAssignments().size() : 0)")
    ConferenceDto.Response toResponse(Conference conference);

    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByName", source = "createdBy", qualifiedByName = "userToName")
    @Mapping(target = "currentParticipants", expression = "java(conference.getCurrentParticipantCount())")
    @Mapping(target = "accessPolicy", source = "accessPolicy", qualifiedByName = "accessPolicyToString")
    @Mapping(target = "assignedCount", expression = "java(conference.getAssignments() != null && org.hibernate.Hibernate.isInitialized(conference.getAssignments()) ? conference.getAssignments().size() : 0)")
    ConferenceDto.Summary toSummary(Conference conference);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "type", source = "type", qualifiedByName = "stringToConferenceType")
    @Mapping(target = "actualStartedAt", ignore = true)
    @Mapping(target = "actualEndedAt", ignore = true)
    @Mapping(target = "requirePassword", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "requireSignedIn", ignore = true)
    @Mapping(target = "muteUponEntry", ignore = true)
    @Mapping(target = "metadata", ignore = true)
    @Mapping(target = "participants", ignore = true)
    @Mapping(target = "assignments", ignore = true)
    @Mapping(target = "tenant", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "accessPolicy", source = "accessPolicy", qualifiedByName = "stringToAccessPolicy")
    Conference toEntity(ConferenceDto.CreateRequest dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "roomName", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "type", source = "type", qualifiedByName = "stringToConferenceType")
    @Mapping(target = "isRecurring", ignore = true)
    @Mapping(target = "recurrenceRule", ignore = true)
    @Mapping(target = "actualStartedAt", ignore = true)
    @Mapping(target = "actualEndedAt", ignore = true)
    @Mapping(target = "requirePassword", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "requireSignedIn", ignore = true)
    @Mapping(target = "muteUponEntry", ignore = true)
    @Mapping(target = "metadata", ignore = true)
    @Mapping(target = "participants", ignore = true)
    @Mapping(target = "assignments", ignore = true)
    @Mapping(target = "tenant", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "accessPolicy", source = "accessPolicy", qualifiedByName = "stringToAccessPolicy")
    void updateEntityFromDto(ConferenceDto.UpdateRequest dto, @MappingTarget Conference conference);

    @Named("userToName")
    default String userToName(User user) {
        if (user == null) {
            return null;
        }
        return user.getFirstName() + " " + user.getLastName();
    }

    @Named("stringToConferenceType")
    default Conference.ConferenceType stringToConferenceType(String type) {
        if (type == null) {
            return Conference.ConferenceType.SCHEDULED;
        }
        return Conference.ConferenceType.valueOf(type);
    }

    @Named("accessPolicyToString")
    default String accessPolicyToString(AccessPolicy policy) {
        if (policy == null) return null;
        return policy.name();
    }

    @Named("stringToAccessPolicy")
    default AccessPolicy stringToAccessPolicy(String policy) {
        if (policy == null) return AccessPolicy.PUBLIC;
        return AccessPolicy.valueOf(policy.toUpperCase());
    }
}
