package com.sonnguyen.base.repository;

import com.sonnguyen.base.model.XiangqiMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface XiangqiMatchRepository extends JpaRepository<XiangqiMatch, Long> {
    @Query("SELECT m FROM XiangqiMatch m WHERE m.redPlayer = :username OR m.blackPlayer = :username ORDER BY m.finishedAt DESC")
    List<XiangqiMatch> findByUser(@Param("username") String username);

    List<XiangqiMatch> findTop30ByOrderByFinishedAtDesc();
}

