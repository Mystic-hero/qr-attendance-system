package com.qrattendance.dto;

import lombok.Data;

@Data
public class StudentSubmissionRequest {
    private String name;
    private String rollNumber;
    private String sessionId;
    private Double latitude;
    private Double longitude;
}
