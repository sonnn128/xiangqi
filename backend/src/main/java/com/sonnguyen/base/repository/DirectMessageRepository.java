package com.sonnguyen.base.repository;

import com.sonnguyen.base.model.DirectMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {
    @Query("SELECT m FROM DirectMessage m WHERE (m.sender = :u1 AND m.recipient = :u2) OR (m.sender = :u2 AND m.recipient = :u1) ORDER BY m.timestamp ASC")
    List<DirectMessage> findConversation(@Param("u1") String u1, @Param("u2") String u2);
}

