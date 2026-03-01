package com.qrattendance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "attendance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "studentList")
@EqualsAndHashCode(exclude = "studentList")
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String subjectName;

    @Column(nullable = false)
    private String subjectCode;

    @Column(nullable = true)
    private LocalDateTime timestamp;

    @Column(nullable = true)
    private Integer totalStudents;

    @Column(nullable = true)
    private boolean active = false;

    @Column(nullable = true)
    private String sessionId;

    @Column(nullable = true)
    private String department;

    @Column(nullable = true)
    private String yearName;

    @Column(nullable = true)
    private Double teacherLatitude;

    @Column(nullable = true)
    private Double teacherLongitude;

    @OneToMany(mappedBy = "attendance", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<StudentAttendance> studentList = new ArrayList<>();
}
