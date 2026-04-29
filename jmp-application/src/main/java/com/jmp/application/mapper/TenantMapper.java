package com.jmp.application.mapper;

import com.jmp.application.dto.TenantDto;
import com.jmp.domain.entity.Tenant;
import org.springframework.stereotype.Component;

/**
 * Mapper for Tenant entity and DTOs.
 */
@Component
public class TenantMapper {

    public TenantDto.Response toResponse(Tenant tenant) {
        if (tenant == null) return null;
        TenantDto.QuotasDto quotas = null;
        if (tenant.getQuotas() != null) {
            Tenant.TenantQuotas q = tenant.getQuotas();
            quotas = new TenantDto.QuotasDto(
                q.getMaxConcurrentConferences(),
                q.getMaxParticipantsPerConference(),
                q.getMaxRecordingStorageMb(),
                q.getMaxConferenceDurationMinutes(),
                q.getAllowedFeatures()
            );
        }
        return new TenantDto.Response(
            tenant.getId(),
            tenant.getName(),
            tenant.getSlug(),
            tenant.getDescription(),
            tenant.getStatus() != null ? tenant.getStatus().name() : null,
            tenant.getDomain(),
            tenant.getJitsiDomain(),
            quotas,
            tenant.getSettings(),
            tenant.getJitsiConfig(),
            tenant.getCreatedAt(),
            tenant.getUpdatedAt(),
            tenant.getSuspendedAt(),
            tenant.getSuspensionReason()
        );
    }

    public TenantDto.Summary toSummary(Tenant tenant) {
        if (tenant == null) return null;
        return new TenantDto.Summary(
            tenant.getId(),
            tenant.getName(),
            tenant.getSlug(),
            tenant.getStatus() != null ? tenant.getStatus().name() : null,
            tenant.getDomain(),
            tenant.getJitsiDomain(),
            tenant.getCreatedAt()
        );
    }

    public Tenant toEntity(TenantDto.CreateRequest dto) {
        Tenant tenant = new Tenant();
        tenant.setName(dto.name());
        tenant.setSlug(dto.slug());
        tenant.setDescription(dto.description());
        tenant.setDomain(dto.domain());
        tenant.setJitsiDomain(dto.jitsiDomain());
        tenant.setStatus(Tenant.TenantStatus.ACTIVE);
        applyQuotas(tenant, dto.quotas());
        return tenant;
    }

    public void updateEntityFromDto(TenantDto.UpdateRequest dto, Tenant tenant) {
        if (dto.name() != null) tenant.setName(dto.name());
        if (dto.description() != null) tenant.setDescription(dto.description());
        if (dto.domain() != null) tenant.setDomain(dto.domain());
        if (dto.jitsiDomain() != null) tenant.setJitsiDomain(dto.jitsiDomain());
        if (dto.quotas() != null) applyQuotas(tenant, dto.quotas());
    }

    private void applyQuotas(Tenant tenant, TenantDto.QuotasDto dto) {
        if (dto == null) return;
        Tenant.TenantQuotas q = tenant.getQuotas();
        if (q == null) {
            q = new Tenant.TenantQuotas();
            tenant.setQuotas(q);
        }
        if (dto.maxConcurrentConferences() != null) q.setMaxConcurrentConferences(dto.maxConcurrentConferences());
        if (dto.maxParticipantsPerConference() != null) q.setMaxParticipantsPerConference(dto.maxParticipantsPerConference());
        if (dto.maxRecordingStorageMb() != null) q.setMaxRecordingStorageMb(dto.maxRecordingStorageMb());
        if (dto.maxConferenceDurationMinutes() != null) q.setMaxConferenceDurationMinutes(dto.maxConferenceDurationMinutes());
        if (dto.allowedFeatures() != null) q.setAllowedFeatures(dto.allowedFeatures());
    }
}
