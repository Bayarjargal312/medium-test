package com.example.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;

import com.example.backend.post.Post;
import com.example.backend.post.PostRepository;

@SpringBootApplication
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    CommandLineRunner seedPosts(PostRepository postRepository) {
        return args -> {
            try {
                if (postRepository.count() > 0) return;
                long now = System.currentTimeMillis();
                String iso = java.time.Instant.ofEpochMilli(now).toString();

                String[][] templates = new String[][]{
                        {
                                "The 100-Article Effect: What Happens Once You Publish 100+ Articles on Your Website",
                                "What will happen to your website and its traffic once you publish 100+ articles?",
                                "Template content for demo purposes.",
                                "Thakur Rahul Singh",
                                "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=1200&auto=format&fit=crop"
                        },
                        {
                                "You’re using ChatGPT wrong. Here’s how to prompt like a pro",
                                "Smarter prompts lead to smarter responses.",
                                "Template content for demo purposes.",
                                "James Wilkins",
                                "https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=1200&auto=format&fit=crop"
                        },
                        {
                                "How to Learn Vocabulary Without Memorising Word Lists",
                                "A personal method for building vocabulary through reading, writing, and emotional connection",
                                "Template content for demo purposes.",
                                "Helen Nomura",
                                "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop"
                        }
                };

                for (String[] t : templates) {
                    String title = t[0];
                    String subtitle = t[1];
                    String content = t[2];
                    String author = t[3];
                    String imageUrl = t[4];

                    String slugBase = title.toLowerCase().replaceAll("[^a-z0-9\\s-]", "").trim().replaceAll("\\s+", "-");
                    String slug = slugBase;
                    int i = 1;
                    while (postRepository.findBySlug(slug) != null) {
                        slug = slugBase + "-" + (i++);
                    }

                    Post p = new Post();
                    p.setTitle(title);
                    p.setSubtitle(subtitle);
                    p.setContent(content);
                    p.setAuthor(author);
                    p.setImageUrl(imageUrl);
                    p.setSlug(slug);
                    p.setCreatedAtEpochMs(now);
                    p.setCreatedAtIso(iso);
                    p.setUpdatedAtEpochMs(now);
                    p.setStatus("APPROVED");
                    postRepository.save(p);
                }
            } catch (Exception ignore) {}
        };
    }
}


