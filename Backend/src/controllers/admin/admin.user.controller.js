import User from "../../models/user.model.js";
import {
  getAllUsersWithRoleStatus,
  getAllDeletedUsers,
  getUserDetailsById,
  updateUserRole,
  updateUserBanStatus,
} from "../../services/admin/admin.user.services.js";
import { getPagination } from "../../utils/getPagination.js";

// Create a route for getting all users and their roles and ban/deletion status
export async function getAllUsersWithRoles(req, res) {
  try {
    // Get query information for users to send
    const { page, limit, offset } = getPagination(req.query);

    const users = await getAllUsersWithRoleStatus(page, limit, offset);

    res.status(200).json({
      users,
      success: true,
      message: "Users fetched successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for getting all soft deleted users
export async function getDeletedUsers(req, res) {
  try {
    // Get query information for users to send
    const { page, limit, offset } = getPagination(req.query);

    const users = await getAllDeletedUsers(page, limit, offset);

    res.status(200).json({
      users,
      success: true,
      message: "Deleted users fetched successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for getting a specific user by id and their details
export async function getUserDetails(req, res) {
  try {
    const { id } = req.params;

    const user = await getUserDetailsById(id);

    res.status(200).json({
      user,
      success: true,
      message: "User details fetched successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for changing a user's role
export async function changeUserRole(req, res) {
  try {
    const { id } = req.params;
    const { newRole } = req.body;

    await updateUserRole(id, newRole);

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for banning a user
export async function banUser(req, res) {
  try {
    const { id } = req.params;

    await updateUserBanStatus(id, true);

    res.status(200).json({
      success: true,
      message: "User banned successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for unbanning a user
export async function unbanUser(req, res) {
  try {
    const { id } = req.params;

    await updateUserBanStatus(id, false);

    res.status(200).json({
      success: true,
      message: "User unbanned successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for deleting a user permanently by id
export async function deleteUserPermanently(req, res) {
  try {
    const { id } = req.params;

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
