package com.qrattendance.repository;

import com.qrattendance.model.Year;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface YearRepository extends JpaRepository<Year, Long> {
    List<Year> findByDegreeId(Long degreeId);
}
