// c-sharp_file_for_testing/SampleCodeWithoutComments.cs
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace TestProject.Services
{
    /// <summary>
    /// Provides functionality for managing user-related operations such as 
    /// creating, retrieving, updating, and deleting user information.
    /// </summary>
    public class UserService
    {
        private readonly IUserRepository _userRepository;
        private readonly ILogger _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="UserService"/> class, providing access to user-related operations.
        /// </summary>
        /// <param name="userRepository">An instance of <see cref="IUserRepository"/> used to interact with user data.</param>
        /// <param name="logger">An instance of <see cref="ILogger"/> used for logging operations.</param>
        /// <exception cref="ArgumentNullException">Thrown when <paramref name="userRepository"/> or <paramref name="logger"/> is null.</exception>
        public UserService(IUserRepository userRepository, ILogger logger)
        {
            _userRepository = userRepository;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves a user by their unique identifier, optionally including deleted users.
        /// </summary>
        /// <param name="userId">The unique identifier of the user to retrieve.</param>
        /// <param name="includeDeleted">A boolean value indicating whether to include deleted users in the result. Defaults to false.</param>
        /// <returns>A <see cref="User"/> object representing the user with the specified ID, or null if no user is found.</returns>
        /// <exception cref="ArgumentException">Thrown when <paramref name="userId"/> is less than or equal to zero.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the user retrieval operation fails due to an internal error.</exception>
        public async Task<User> GetUserByIdAsync(int userId, bool includeDeleted = false)
        {
            if (userId <= 0)
                throw new ArgumentException("User ID must be positive", nameof(userId));

            var user = await _userRepository.GetByIdAsync(userId);

            if (user == null)
                return null;

            return includeDeleted || !user.IsDeleted ? user : null;
        }

        /// <summary>
        /// Retrieves a paginated list of active users asynchronously.
        /// </summary>
        /// <param name="pageSize">The number of users to include per page. Defaults to 10.</param>
        /// <param name="pageNumber">The page number to retrieve. Defaults to 1.</param>
        /// <returns>A task that represents the asynchronous operation. The task result contains a list of active users.</returns>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when <paramref name="pageSize"/> or <paramref name="pageNumber"/> is less than 1.</exception>
        /// <exception cref="Exception">Thrown if an error occurs while retrieving the active users.</exception>
        public async Task<List<User>> GetActiveUsersAsync(int pageSize = 10, int pageNumber = 1)
        {
            var skip = (pageNumber - 1) * pageSize;
            return await _userRepository.GetActiveUsersAsync(skip, pageSize);
        }

        /// <summary>
        /// Updates the status of a user asynchronously.
        /// </summary>
        /// <param name="userId">The unique identifier of the user whose status is being updated.</param>
        /// <param name="status">The new status to assign to the user.</param>
        /// <returns>A task that represents the asynchronous operation. The task result contains a boolean value indicating whether the update was successful.</returns>
        /// <exception cref="ArgumentException">Thrown when the <paramref name="userId"/> is less than or equal to zero.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the specified <paramref name="status"/> is invalid or cannot be applied.</exception>
        /// <exception cref="Exception">Thrown when an unexpected error occurs during the update process.</exception>
        public async Task<bool> UpdateUserStatusAsync(int userId, UserStatus status)
        {
            var user = await GetUserByIdAsync(userId);
            if (user == null)
                return false;

            user.Status = status;
            user.UpdatedAt = DateTime.UtcNow;

            return await _userRepository.UpdateAsync(user);
        }

        /// <summary>
        /// Formats the display name of a user by combining their first and last names.
        /// </summary>
        /// <param name="user">The user object containing the first and last name information.</param>
        /// <returns>A formatted string representing the user's display name.</returns>
        /// <exception cref="ArgumentNullException">Thrown when the <paramref name="user"/> parameter is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the user's first or last name is null or empty.</exception>
        public string FormatUserDisplayName(User user)
        {
            if (user == null)
                return "Unknown User";

            if (string.IsNullOrEmpty(user.FirstName) && string.IsNullOrEmpty(user.LastName))
                return user.Email ?? "No Name";

            return $"{user.FirstName} {user.LastName}".Trim();
        }

        /// <summary>
        /// Determines whether a user is eligible for promotion based on the specified cutoff date.
        /// </summary>
        /// <param name="user">The user whose eligibility is being evaluated. Must be a valid <see cref="User"/> object.</param>
        /// <param name="cutoffDate">The date used to determine eligibility. Promotions are evaluated relative to this date.</param>
        /// <returns><c>true</c> if the user is eligible for promotion; otherwise, <c>false</c>.</returns>
        /// <exception cref="ArgumentNullException">Thrown when the <paramref name="user"/> parameter is <c>null</c>.</exception>
        /// <exception cref="ArgumentException">Thrown when the <paramref name="cutoffDate"/> is not a valid date.</exception>
        public bool IsUserEligibleForPromotion(User user, DateTime cutoffDate)
        {
            return user != null
                && user.CreatedAt <= cutoffDate
                && user.Status == UserStatus.Active
                && user.LoginCount >= 10;
        }
    }

    /// <summary>
    /// Defines the contract for managing user-related data operations.
    /// </summary>
    /// <remarks>
    /// This interface provides methods for creating, reading, updating, and deleting user data.
    /// Implementations should handle data persistence and retrieval.
    /// </remarks>
    /// <typeparam name="TUser">The type representing a user entity.</typeparam>
    /// <typeparam name="TKey">The type representing the unique identifier for a user.</typeparam>
    /// <exception cref="ArgumentNullException">Thrown when a required parameter is null.</exception>
    /// <exception cref="InvalidOperationException">Thrown when an operation cannot be completed due to invalid state.</exception>
    public interface IUserRepository
    {
        Task<User> GetByIdAsync(int id);
        Task<List<User>> GetActiveUsersAsync(int skip, int take);
        Task<bool> UpdateAsync(User user);
    }

    /// <summary>
    /// Represents a user in the system, encapsulating user-related data and behaviors.
    /// </summary>
    public class User
    {
        /// <summary>
        /// Gets or sets the unique identifier for an entity.
        /// </summary>
        /// <value>
        /// An integer representing the unique identifier.
        /// </value>
        /// <exception cref="System.Exception">
        /// Thrown if the value assigned is invalid.
        /// </exception>
        public int Id { get; set; }
        /// <summary>
        /// Gets or sets the first name of a person.
        /// </summary>
        /// <value>
        /// A string representing the first name.
        /// </value>
        /// <exception cref="System.ArgumentException">
        /// Thrown when an invalid value is assigned to the property.
        /// </exception>
        public string FirstName { get; set; }
        /// <summary>
        /// Gets or sets the last name of a person.
        /// </summary>
        /// <value>
        /// A <see cref="string"/> representing the last name.
        /// </value>
        /// <exception cref="ArgumentException">
        /// Thrown when an invalid value is assigned to the property.
        /// </exception>
        public string LastName { get; set; }
        /// <summary>
        /// Gets or sets the email address associated with the user.
        /// </summary>
        /// <value>
        /// A string representing the user's email address.
        /// </value>
        /// <exception cref="ArgumentException">
        /// Thrown when an invalid email format is assigned.
        /// </exception>
        public string Email { get; set; }
        /// <summary>
        /// Gets or sets the status of the user.
        /// </summary>
        /// <value>
        /// A <see cref="UserStatus"/> value representing the current status of the user.
        /// </value>
        /// <exception cref="InvalidOperationException">
        /// Thrown if an invalid status is assigned.
        /// </exception>
        public UserStatus Status { get; set; }
        /// <summary>
        /// Gets or sets a value indicating whether the entity is marked as deleted.
        /// </summary>
        /// <value>
        /// A boolean value where <c>true</c> indicates the entity is deleted, and <c>false</c> indicates it is not.
        /// </value>
        public bool IsDeleted { get; set; }
        /// <summary>
        /// Gets or sets the date and time when the entity was created.
        /// </summary>
        /// <value>
        /// A <see cref="DateTime"/> representing the creation timestamp of the entity.
        /// </value>
        /// <exception cref="ArgumentOutOfRangeException">
        /// Thrown when an attempt is made to set the property to a value earlier than January 1, 0001 or later than December 31, 9999.
        /// </exception>
        public DateTime CreatedAt { get; set; }
        /// <summary>
        /// Gets or sets the date and time when the entity was last updated.
        /// </summary>
        /// <value>
        /// A <see cref="DateTime"/> representing the timestamp of the last update.
        /// </value>
        public DateTime UpdatedAt { get; set; }
        /// <summary>
        /// Gets or sets the number of times a user has logged in.
        /// </summary>
        /// <value>
        /// An integer representing the total login count for the user.
        /// </value>
        /// <exception cref="System.OverflowException">
        /// Thrown if the value exceeds the maximum allowable integer size.
        /// </exception>
        public int LoginCount { get; set; }
    }

    /// <summary>
    /// Represents the status of a user within the system.
    /// </summary>
    public enum UserStatus
    {
        Inactive,
        Active,
        Suspended,
        PendingVerification
    }

    /// <summary>
    /// Represents the base class for all service implementations, providing common functionality 
    /// and a foundation for derived service classes.
    /// </summary>
    public abstract class BaseService
    {
        protected readonly ILogger Logger;

        /// <summary>
        /// Initializes a new instance of the BaseService class with the specified logger.
        /// </summary>
        /// <param name="logger">An instance of <see cref="ILogger"/> used for logging within the service.</param>
        protected BaseService(ILogger logger)
        {
            Logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Logs details of an operation, including its name and optional parameters.
        /// </summary>
        /// <param name="operation">The name of the operation being logged. Must be a non-null string.</param>
        /// <param name="parameters">Optional parameters associated with the operation. Can be any object or null.</param>
        /// <exception cref="ArgumentNullException">Thrown when the <paramref name="operation"/> parameter is null.</exception>
        protected virtual void LogOperation(string operation, object parameters = null)
        {
            Logger.Log($"Operation: {operation}, Parameters: {parameters}");
        }
    }

    /// <summary>
    /// Provides extension methods for user-related operations, enabling additional functionality 
    /// for user objects without modifying their original implementation.
    /// </summary>
    public static class UserExtensions
    {
        /// <summary>
        /// Retrieves the full name of the specified user by combining their first and last names.
        /// </summary>
        /// <param name="user">The <see cref="User"/> instance for which the full name is to be retrieved.</param>
        /// <returns>A <see cref="string"/> representing the user's full name, formatted as "FirstName LastName".</returns>
        /// <exception cref="ArgumentNullException">Thrown when the <paramref name="user"/> parameter is null.</exception>
        public static string GetFullName(this User user)
        {
            return user?.FirstName + " " + user?.LastName;
        }

        /// <summary>
        /// Determines whether the specified user has a valid email address.
        /// </summary>
        /// <param name="user">The user object to validate.</param>
        /// <returns>
        /// <c>true</c> if the user has a valid email address; otherwise, <c>false</c>.
        /// </returns>
        /// <exception cref="ArgumentNullException">Thrown when the <paramref name="user"/> parameter is null.</exception>
        public static bool HasValidEmail(this User user)
        {
            return !string.IsNullOrEmpty(user?.Email) && user.Email.Contains("@");
        }
    }
}