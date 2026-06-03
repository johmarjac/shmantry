namespace Shmantry.Shared.Services;

public interface IOneDriveService
{
    Task<bool?> CheckShmantryFileExistsAsync();
}
