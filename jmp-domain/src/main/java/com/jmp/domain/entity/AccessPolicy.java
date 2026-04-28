package com.jmp.domain.entity;

/**
 * Access policy for conference participation control.
 * Per specification §8.1
 */
public enum AccessPolicy {
    PUBLIC,
    ASSIGNED_ONLY,
    DOMAIN_RESTRICTED
}
