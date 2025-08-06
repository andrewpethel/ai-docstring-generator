// c-sharp_file_for_testing/SampleCode.cs
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace TestProject.Services
{
    public class UserService
    {
        private readonly IUserRepository _userRepository;
        private readonly ILogger _logger;

        public UserService(IUserRepository userRepository, ILogger logger)
        {
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<User> GetUserByIdAsync(int userId, bool includeDeleted = false)
        {
            if (userId <= 0)
                throw new ArgumentException("User ID must be positive", nameof(userId));

            var user = await _userRepository.GetByIdAsync(userId);
            
            if (user == null)
                return null;

            return includeDeleted || !user.IsDeleted ? user : null;
        }

        public async Task<List<User>> GetActiveUsersAsync(int pageSize = 10, int pageNumber = 1)
        {
            var skip = (pageNumber - 1) * pageSize;
            return await _userRepository.GetActiveUsersAsync(skip, pageSize);
        }

        public async Task<bool> UpdateUserStatusAsync(int userId, UserStatus status)
        {
            var user = await GetUserByIdAsync(userId);
            if (user == null)
                return false;

            user.Status = status;
            user.UpdatedAt = DateTime.UtcNow;
            
            return await _userRepository.UpdateAsync(user);
        }

        public string FormatUserDisplayName(User user)
        {
            if (user == null)
                return "Unknown User";

            if (string.IsNullOrEmpty(user.FirstName) && string.IsNullOrEmpty(user.LastName))
                return user.Email ?? "No Name";

            return $"{user.FirstName} {user.LastName}".Trim();
        }

        public bool IsUserEligibleForPromotion(User user, DateTime cutoffDate)
        {
            return user != null 
                && user.CreatedAt <= cutoffDate 
                && user.Status == UserStatus.Active
                && user.LoginCount >= 10;
        }
    }

    public interface IUserRepository
    {
        Task<User> GetByIdAsync(int id);
        Task<List<User>> GetActiveUsersAsync(int skip, int take);
        Task<bool> UpdateAsync(User user);
    }

    public class User
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public UserStatus Status { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int LoginCount { get; set; }
    }

    public enum UserStatus
    {
        Inactive,
        Active,
        Suspended,
        PendingVerification
    }

    public abstract class BaseService
    {
        protected readonly ILogger Logger;

        protected BaseService(ILogger logger)
        {
            Logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        protected virtual void LogOperation(string operation, object parameters = null)
        {
            Logger.Log($"Operation: {operation}, Parameters: {parameters}");
        }
    }

    public static class UserExtensions
    {
        public static string GetFullName(this User user)
        {
            return user?.FirstName + " " + user?.LastName;
        }

        public static bool HasValidEmail(this User user)
        {
            return !string.IsNullOrEmpty(user?.Email) && user.Email.Contains("@");
        }
    }
}