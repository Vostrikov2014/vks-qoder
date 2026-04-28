package com.jmp.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.jmp.application.dto.ParticipantAssignmentDto;
import com.jmp.domain.entity.AssignmentAuditLog;
import com.jmp.domain.entity.ParticipantAssignment;

/**
 * MapStruct mapper for ParticipantAssignment entity and DTOs.
 * Per specification §8.1
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface ParticipantAssignmentMapper {

    @Mapping(target = "conferenceId", source = "conference.id")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "role", source = "role", qualifiedByName = "assignmentRoleToString")
    @Mapping(target = "status", source = "status", qualifiedByName = "assignmentStatusToString")
    ParticipantAssignmentDto.Response toResponse(ParticipantAssignment assignment);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "conference", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "invitedAt", ignore = true)
    @Mapping(target = "respondedAt", ignore = true)
    @Mapping(target = "joinedAt", ignore = true)
    @Mapping(target = "leftAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "role", source = "role", qualifiedByName = "stringToAssignmentRole")
    ParticipantAssignment toEntity(ParticipantAssignmentDto.CreateRequest dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "conference", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "invitedAt", ignore = true)
    @Mapping(target = "respondedAt", ignore = true)
    @Mapping(target = "joinedAt", ignore = true)
    @Mapping(target = "leftAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "role", source = "role", qualifiedByName = "stringToAssignmentRole")
    @Mapping(target = "status", source = "status", qualifiedByName = "stringToAssignmentStatus")
    void updateEntityFromDto(ParticipantAssignmentDto.UpdateRequest dto, @MappingTarget ParticipantAssignment assignment);

    @Mapping(target = "conferenceId", source = "conferenceId")
    @Mapping(target = "actorId", source = "actorId")
    @Mapping(target = "targetUserId", source = "targetUserId")
    @Mapping(target = "targetEmail", source = "targetEmail")
    ParticipantAssignmentDto.AuditLogResponse toAuditLogResponse(AssignmentAuditLog auditLog);

    @Named("assignmentRoleToString")
    default String assignmentRoleToString(ParticipantAssignment.AssignmentRole role) {
        if (role == null) return null;
        return role.name();
    }

    @Named("assignmentStatusToString")
    default String assignmentStatusToString(ParticipantAssignment.AssignmentStatus status) {
        if (status == null) return null;
        return status.name();
    }

    @Named("stringToAssignmentRole")
    default ParticipantAssignment.AssignmentRole stringToAssignmentRole(String role) {
        if (role == null) return ParticipantAssignment.AssignmentRole.PARTICIPANT;
        return ParticipantAssignment.AssignmentRole.valueOf(role.toUpperCase());
    }

    @Named("stringToAssignmentStatus")
    default ParticipantAssignment.AssignmentStatus stringToAssignmentStatus(String status) {
        if (status == null) return null;
        return ParticipantAssignment.AssignmentStatus.valueOf(status.toUpperCase());
    }
}
