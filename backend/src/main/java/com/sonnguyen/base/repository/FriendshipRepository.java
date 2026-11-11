package com.sonnguyen.base.repository;

import com.sonnguyen.base.model.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    @Query("SELECT f FROM Friendship f WHERE (f.userA = :username OR f.userB = :username) AND f.status = 'ACCEPTED'")
    List<Friendship> findAcceptedFriends(@Param("username") String username);

    @Query("SELECT f FROM Friendship f WHERE (f.userA = :u1 AND f.userB = :u2) OR (f.userA = :u2 AND f.userB = :u1)")
    Optional<Friendship> findBetween(@Param("u1") String u1, @Param("u2") String u2);

    @Query("SELECT f FROM Friendship f WHERE (f.userA = :username OR f.userB = :username) AND f.status = 'PENDING' AND f.requestedBy <> :username")
    List<Friendship> findIncomingRequests(@Param("username") String username);
}

