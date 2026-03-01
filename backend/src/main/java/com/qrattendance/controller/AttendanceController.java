package com.qrattendance.controller;

import com.qrattendance.dto.StudentSubmissionRequest;
import com.qrattendance.model.Attendance;
import com.qrattendance.model.StudentAttendance;
import com.qrattendance.repository.AttendanceRepository;
import com.qrattendance.repository.StudentAttendanceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceController.class);

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private StudentAttendanceRepository studentAttendanceRepository;

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("Attendance API is reachable");
    }

    @GetMapping("/records")
    public ResponseEntity<?> getAllRecords() {
        try {
            return ResponseEntity.ok(attendanceRepository.findAll());
        } catch (Exception e) {
            logger.error("Error fetching all records: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching records: " + e.getMessage());
        }
    }

    @GetMapping("/server-ip")
    public ResponseEntity<String> getServerIp() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            for (NetworkInterface networkInterface : Collections.list(interfaces)) {
                if (networkInterface.isLoopback() || !networkInterface.isUp()) {
                    continue;
                }
                Enumeration<InetAddress> addresses = networkInterface.getInetAddresses();
                for (InetAddress address : Collections.list(addresses)) {
                    if (address.getHostAddress().contains(":")) {
                        continue; // Skip IPv6
                    }
                    if (!address.isLoopbackAddress() && address.isSiteLocalAddress()) {
                        return ResponseEntity.ok(address.getHostAddress());
                    }
                }
            }
            return ResponseEntity.ok(InetAddress.getLocalHost().getHostAddress());
        } catch (Exception e) {
            logger.error("Error detecting server IP: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("127.0.0.1");
        }
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveSession() {
        try {
            logger.info("Fetching active session...");
            List<Attendance> activeSessions = attendanceRepository.findAllByActive(true);
            logger.info("Found {} active sessions", activeSessions.size());
            if (activeSessions.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(activeSessions.get(activeSessions.size() - 1));
        } catch (Exception e) {
            logger.error("Error fetching active session: ", e);
            e.printStackTrace(); // Print to server console too
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching active session: " + e.getMessage());
        }
    }

    @PostMapping("/start")
    public ResponseEntity<?> startSession(@RequestBody Attendance attendance) {
        try {
            logger.info("Starting session for subject: {}", attendance.getSubjectName());

            // Stop all existing active sessions
            List<Attendance> activeSessions = attendanceRepository.findAllByActive(true);
            for (Attendance a : activeSessions) {
                a.setActive(false);
                attendanceRepository.save(a);
            }

            attendance.setActive(true);
            if (attendance.getTimestamp() == null) {
                attendance.setTimestamp(LocalDateTime.now());
            }
            if (attendance.getDepartment() == null || attendance.getDepartment().trim().isEmpty()) {
                attendance.setDepartment("N/A");
            }
            Attendance saved = attendanceRepository.save(attendance);
            logger.info("Session started with ID: {}. Teacher Location: [{}, {}]",
                    saved.getId(), saved.getTeacherLatitude(), saved.getTeacherLongitude());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            logger.error("Error starting session: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error starting session: " + e.getMessage());
        }
    }

    @PostMapping("/stop/{id}")
    public ResponseEntity<Attendance> stopSession(@PathVariable Long id) {
        if (id == null) {
            return ResponseEntity.badRequest().build();
        }
        return attendanceRepository.findById(id).map(attendance -> {
            attendance.setActive(false);
            return ResponseEntity.ok(attendanceRepository.save(attendance));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitAttendance(@RequestBody StudentSubmissionRequest request) {
        try {
            Optional<Attendance> attendanceOpt = attendanceRepository.findBySessionId(request.getSessionId());

            if (attendanceOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Session not found or invalid.");
            }

            Attendance attendance = attendanceOpt.get();
            if (!attendance.isActive()) {
                return ResponseEntity.badRequest().body("Session is no longer active.");
            }

            // Location Validation (15-meter radius)
            if (attendance.getTeacherLatitude() != null && attendance.getTeacherLongitude() != null) {
                if (request.getLatitude() == null || request.getLongitude() == null) {
                    logger.warn("Attendance denied: Student {} did not provide location.", request.getRollNumber());
                    return ResponseEntity.badRequest().body("Location information is required to mark attendance.");
                }

                double distance = calculateDistance(
                        attendance.getTeacherLatitude(), attendance.getTeacherLongitude(),
                        request.getLatitude(), request.getLongitude());

                logger.info("Distance Check: Student {} [{}, {}] is {} meters away from Teacher [{}, {}]",
                        request.getRollNumber(), request.getLatitude(), request.getLongitude(),
                        distance, attendance.getTeacherLatitude(), attendance.getTeacherLongitude());

                if (distance > 25.0) {
                    return ResponseEntity.badRequest()
                            .body(String.format(
                                    "You are not within the allowed attendance area. (Approx. %.1f meters away)",
                                    distance));
                }
            } else {
                logger.error("BLOCKING: Session {} does not have teacher location. Attendance rejected for safety.",
                        request.getSessionId());
                return ResponseEntity.badRequest().body(
                        "Technical Error: Attendance location not set by teacher. Please ask teacher to restart the session.");
            }

            // Check for duplicate roll number in this session
            boolean alreadyMarked = attendance.getStudentList().stream()
                    .anyMatch(s -> s.getRollNumber().equals(request.getRollNumber()));

            if (alreadyMarked) {
                return ResponseEntity.badRequest().body("Attendance already marked for this roll number.");
            }

            StudentAttendance student = new StudentAttendance();
            student.setName(request.getName());
            student.setStudentName(request.getName()); // Satisfy redundant column
            student.setRollNumber(request.getRollNumber());
            student.setTimestamp(LocalDateTime.now());
            student.setAttendance(attendance);

            // Removed department setting as requested
            student.setDepartment("N/A");

            studentAttendanceRepository.save(student);

            return ResponseEntity.ok("Attendance marked successfully.");
        } catch (Exception e) {
            logger.error("Error submitting attendance: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error submitting attendance: " + e.getMessage());
        }
    }

    /**
     * Haversine formula to calculate distance between two points in meters
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // convert to meters
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAttendance(@PathVariable Long id) {
        try {
            if (id != null && attendanceRepository.existsById(id)) {
                attendanceRepository.deleteById(id);
                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error deleting attendance: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting record: " + e.getMessage());
        }
    }
}
