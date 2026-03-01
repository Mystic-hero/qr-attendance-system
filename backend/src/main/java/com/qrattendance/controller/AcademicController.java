package com.qrattendance.controller;

import com.qrattendance.model.Degree;
import com.qrattendance.model.Subject;
import com.qrattendance.model.Year;
import com.qrattendance.repository.DegreeRepository;
import com.qrattendance.repository.SubjectRepository;
import com.qrattendance.repository.YearRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academic")
public class AcademicController {

    @Autowired
    private DegreeRepository degreeRepository;

    @Autowired
    private YearRepository yearRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @GetMapping("/degrees")
    public List<Degree> getDegrees() {
        return degreeRepository.findAll();
    }

    @GetMapping("/years")
    public List<Year> getYears(@RequestParam Long degreeId) {
        return yearRepository.findByDegreeId(degreeId);
    }

    @GetMapping("/subjects")
    public List<Subject> getSubjects(@RequestParam Long yearId) {
        return subjectRepository.findByYearId(yearId);
    }

    @GetMapping("/health")
    public String health() {
        return "Academic API is running";
    }
}
