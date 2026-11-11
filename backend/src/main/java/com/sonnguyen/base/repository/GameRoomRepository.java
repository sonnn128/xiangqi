package com.sonnguyen.base.repository;

import com.sonnguyen.base.model.GameRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameRoomRepository extends JpaRepository<GameRoom, String> {
    List<GameRoom> findTop20ByOrderByUpdatedAtDesc();
}

