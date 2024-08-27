import UserDto from "green-wheels-core/src/user/user.dto";

export interface GetUserParams {
    id: number;
}

export interface GetUsersParams {
    ids?: number[];
}

export interface DeleteUserParams {
    id: number;
}

export interface CreateUserBody {
    user: UserDto;
}
