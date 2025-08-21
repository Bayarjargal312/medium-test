package com.example.backend.comment;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface CommentRepository extends MongoRepository<Comment, String> {
    List<Comment> findByPostSlugOrderByCreatedAtEpochMsAsc(String postSlug);
}


