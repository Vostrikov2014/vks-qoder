package com.jmp.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.jmp.application.dto.ConferenceDto;
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
    ConferenceDto.Response toResponse(Conference conference);

    @Mapping(target = "currentParticipants", expression = "java(conference.getCurrentParticipantCount())")
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
    @Mapping(target = "tenant", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
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
    @Mapping(target = "tenant", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    void updateEntityFromDto(ConferenceDto.UpdateRequest dto, @MappingTarget Conference conference);

    @Named("userToName")
    default String userToName(com.jmp.domain.entity.User user) {
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
}
