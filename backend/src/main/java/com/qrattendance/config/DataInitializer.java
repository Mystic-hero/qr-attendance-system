package com.qrattendance.config;

import com.qrattendance.model.Degree;
import com.qrattendance.model.Subject;
import com.qrattendance.model.Year;
import com.qrattendance.repository.AttendanceRepository;
import com.qrattendance.repository.DegreeRepository;
import com.qrattendance.repository.StudentAttendanceRepository;
import com.qrattendance.repository.SubjectRepository;
import com.qrattendance.repository.YearRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

        @Autowired
        private DegreeRepository degreeRepository;

        @Autowired
        private YearRepository yearRepository;

        @Autowired
        private SubjectRepository subjectRepository;

        @Autowired
        private AttendanceRepository attendanceRepository;

        @Autowired
        private StudentAttendanceRepository studentAttendanceRepository;

        @Override
        @Transactional
        public void run(String... args) throws Exception {
                // Check if data already exists
                long degreeCount = degreeRepository.count();
                if (degreeCount > 0) {
                        System.out.println("--- Database already has data. Skipping initialization. ---");
                        return;
                }

                System.out.println("--- Starting Academic Data Seeding (Empty Database) ---");

                // --- B.Sc (Computer Science) ---
                Degree bsc = new Degree(null, "B.Sc (Computer Science)");
                bsc = degreeRepository.save(bsc);

                Year bsc1 = new Year(null, "1st Year", bsc);
                Year bsc2 = new Year(null, "2nd Year", bsc);
                Year bsc3 = new Year(null, "3rd Year", bsc);
                yearRepository.saveAll(Arrays.asList(bsc1, bsc2, bsc3));

                subjectRepository.saveAll(Arrays.asList(
                                // 1st Year (BSC - CS)
                                new Subject(null, "Programming in C", "BSC101", bsc1),
                                new Subject(null, "Digital Electronics", "BSC102", bsc1),
                                new Subject(null, "Discrete Mathematics", "BSC103", bsc1),
                                new Subject(null, "Communicative English - I", "ENG101", bsc1),
                                new Subject(null, "Foundations of Mathematics", "MAT101", bsc1),
                                new Subject(null, "Computer Fundamentals", "BSC104", bsc1),
                                // 2nd Year (BSC - CS)
                                new Subject(null, "Data Structures and Algorithms", "BSC201", bsc2),
                                new Subject(null, "Object Oriented Programming (C++)", "BSC202", bsc2),
                                new Subject(null, "Statistical Methods", "MAT201", bsc2),
                                new Subject(null, "Communicative English - II", "ENG201", bsc2),
                                new Subject(null, "Calculus and Differential Equations", "MAT202", bsc2),
                                new Subject(null, "Environmental Studies", "EVS201", bsc2),
                                // 3rd Year (BSC - CS)
                                new Subject(null, "Operating Systems", "BSC301", bsc3),
                                new Subject(null, "Software Engineering", "BSC302", bsc3),
                                new Subject(null, "Computer Networks", "BSC303", bsc3),
                                new Subject(null, "Artificial Intelligence", "BSC304", bsc3),
                                new Subject(null, "Python Programming", "BSC305", bsc3),
                                new Subject(null, "Cloud Computing Concepts", "BSC306", bsc3)));

                // --- BCA (Computer Applications) ---
                Degree bca = new Degree(null, "BCA (Computer Applications)");
                bca = degreeRepository.save(bca);

                Year bca1 = new Year(null, "1st Year", bca);
                Year bca2 = new Year(null, "2nd Year", bca);
                Year bca3 = new Year(null, "3rd Year", bca);
                yearRepository.saveAll(Arrays.asList(bca1, bca2, bca3));

                subjectRepository.saveAll(Arrays.asList(
                                // 1st Year (BCA)
                                new Subject(null, "Web Technologies", "BCA101", bca1),
                                new Subject(null, "Computer Architecture", "BCA102", bca1),
                                new Subject(null, "Business Communication English", "ENG_B1", bca1),
                                new Subject(null, "Mathematical Foundations for BCA", "MAT_B1", bca1),
                                new Subject(null, "Information Technology Basics", "BCA103", bca1),
                                // 2nd Year (BCA)
                                new Subject(null, "Database Management System", "BCA201", bca2),
                                new Subject(null, "Java Programming", "BCA202", bca2),
                                new Subject(null, "System Analysis and Design", "BCA203", bca2),
                                new Subject(null, "Functional English", "ENG_B2", bca2),
                                new Subject(null, "Numerical & Statistical Methods", "MAT_B2", bca2),
                                new Subject(null, "Operating System Principles", "BCA204", bca2),
                                // 3rd Year (BCA)
                                new Subject(null, "Advanced Web programming", "BCA301", bca3),
                                new Subject(null, "Cyber Security Fundamentals", "BCA302", bca3),
                                new Subject(null, "Cloud application framework", "BCA303", bca3),
                                new Subject(null, "Mobile App Development (Android)", "BCA304", bca3),
                                new Subject(null, "Data Mining & Warehousing", "BCA305", bca3)));

                // --- B.Com (General) ---
                Degree bcom = new Degree(null, "B.Com (General)");
                bcom = degreeRepository.save(bcom);

                Year bcom1 = new Year(null, "1st Year", bcom);
                Year bcom2 = new Year(null, "2nd Year", bcom);
                Year bcom3 = new Year(null, "3rd Year", bcom);
                yearRepository.saveAll(Arrays.asList(bcom1, bcom2, bcom3));

                subjectRepository.saveAll(Arrays.asList(
                                // 1st Year (B.Com)
                                new Subject(null, "Financial Accounting - I", "BCM101", bcom1),
                                new Subject(null, "Business Economics", "BCM102", bcom1),
                                new Subject(null, "English for Commerce", "ENG_C1", bcom1),
                                new Subject(null, "Business Mathematics - I", "MAT_C1", bcom1),
                                new Subject(null, "Principles of Management", "BCM103", bcom1),
                                // 2nd Year (B.Com)
                                new Subject(null, "Corporate Accounting", "BCM201", bcom2),
                                new Subject(null, "Business Law", "BCM202", bcom2),
                                new Subject(null, "Cost Accounting", "BCM203", bcom2),
                                new Subject(null, "Business Statistics", "MAT_C2", bcom2),
                                new Subject(null, "English for Special Purposes", "ENG_C2", bcom2),
                                new Subject(null, "E-Commerce", "BCM204", bcom2),
                                // 3rd Year (B.Com)
                                new Subject(null, "Management Accounting", "BCM301", bcom3),
                                new Subject(null, "Income Tax Law & Practice", "BCM302", bcom3),
                                new Subject(null, "Auditing & Assurance", "BCM303", bcom3),
                                new Subject(null, "Marketing Management", "BCM304", bcom3),
                                new Subject(null, "Financial Management", "BCM305", bcom3)));

                System.out.println("--- Academic Data Refresh Complete! ---");
        }
}
