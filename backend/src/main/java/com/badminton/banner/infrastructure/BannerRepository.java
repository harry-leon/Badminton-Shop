package com.badminton.banner.infrastructure;

import com.badminton.banner.domain.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface BannerRepository extends JpaRepository<Banner, UUID> {

    List<Banner> findByPositionOrderBySortOrderAscCreatedAtDesc(String position);

    List<Banner> findAllByOrderBySortOrderAscCreatedAtDesc();

    @Query("SELECT b FROM Banner b WHERE b.isActive = true " +
           "AND (:position IS NULL OR b.position = :position) " +
           "AND (b.startAt IS NULL OR b.startAt <= :now) " +
           "AND (b.endAt IS NULL OR b.endAt >= :now) " +
           "ORDER BY b.sortOrder ASC, b.createdAt DESC")
    List<Banner> findActiveValidBanners(@Param("position") String position, @Param("now") Instant now);
}
