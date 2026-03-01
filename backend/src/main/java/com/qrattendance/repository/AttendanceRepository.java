package com.qrattendance.repository;

import com.qrattendance.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findAllByActive(boolean active);

    Optional<Attendance> findBySessionId(String sessionId);
}
