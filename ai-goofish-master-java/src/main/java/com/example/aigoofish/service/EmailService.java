package com.example.aigoofish.service;

import com.example.aigoofish.mapper.EmailLogMapper;
import com.example.aigoofish.model.AiAnalysis;
import com.example.aigoofish.model.EmailLog;
import com.example.aigoofish.model.Product;
import com.example.aigoofish.model.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import javax.mail.internet.MimeMessage;
import java.time.LocalDateTime;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private EmailLogMapper emailLogMapper;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendProductNotification(Product product, AiAnalysis aiAnalysis, Task task) {
        if (mailSender == null || fromEmail == null || fromEmail.isEmpty() || fromEmail.equals("YOUR_EMAIL_USERNAME")) {
            System.err.println("  [Email] Mail service is not configured. Skipping email notification.");
            return;
        }

        if (task.getEmailAddress() == null || task.getEmailAddress().isEmpty()) {
            System.err.println("  [Email] No recipient email address configured for this task. Skipping.");
            return;
        }

        String subject = "[AI Goofish] 推荐商品: " + product.getTitle();
        String htmlContent = buildHtmlContent(product, aiAnalysis, task);
        EmailLog emailLog = createLog(product, task, subject);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(task.getEmailAddress());
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);

            System.out.println("  [Email] Notification email sent successfully to " + task.getEmailAddress());
            updateLog(emailLog, "SUCCESS", null);

        } catch (Exception e) {
            System.err.println("  [Email] Failed to send notification email: " + e.getMessage());
            updateLog(emailLog, "FAILED", e.getMessage());
        }
    }

    private String buildHtmlContent(Product product, AiAnalysis aiAnalysis, Task task) {
        return "<html>" +
               "<body style='font-family: Arial, sans-serif; color: #333;'>" +
               "<h2>AI Goofish 智能监控提醒</h2>" +
               "<p>您关注的任务 <strong>" + task.getTaskName() + "</strong> 发现了一个推荐商品:</p>" +
               "<div style='border: 1px solid #ddd; padding: 15px; border-radius: 8px;'>" +
               "<h3>" + product.getTitle() + "</h3>" +
               "<p><strong>价格:</strong> <span style='color: #d9534f;'>" + product.getPrice() + "</span></p>" +
               "<p><strong>AI 推荐理由:</strong> " + aiAnalysis.getReason() + "</p>" +
               "<a href='" + product.getLink() + "' style='display: inline-block; padding: 10px 15px; background-color: #337ab7; color: #fff; text-decoration: none; border-radius: 5px;'>查看商品详情</a>" +
               "</div>" +
               "<p style='font-size: 12px; color: #888;'>该邮件由 AI Goofish 系统自动发送，请勿直接回复。</p>" +
               "</body>" +
               "</html>";
    }

    private EmailLog createLog(Product product, Task task, String subject) {
        EmailLog log = new EmailLog();
        log.setTaskId(task.getId());
        log.setProductId(product.getId());
        log.setEmailAddress(task.getEmailAddress());
        log.setSubject(subject);
        log.setStatus("PENDING");
        log.setSentAt(LocalDateTime.now());
        emailLogMapper.insert(log);
        return log;
    }

    private void updateLog(EmailLog log, String status, String errorMessage) {
        log.setStatus(status);
        log.setErrorMessage(errorMessage);
        emailLogMapper.updateById(log);
    }
}
