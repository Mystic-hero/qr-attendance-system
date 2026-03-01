package com.qrattendance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class QrAttendanceApplication {

    public static void main(String[] args) {
        SpringApplication.run(QrAttendanceApplication.class, args);
        System.out.println("\n===========================================");
        System.out.println("QR Attendance Backend is running!");
        System.out.println("Server: http://localhost:8080");
        System.out.println("Health Check: http://localhost:8080/api/auth/health");
        System.out.println("===========================================\n");
    }
}
