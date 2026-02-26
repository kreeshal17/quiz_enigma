"use client";

import React from 'react'
import { createAnswer } from '../firebase/answer.controller';

const Page = () => {
    const handler = async () => {
        createAnswer({
            teamId : "3YINepQ5lDWUOoF5wrpw",
            questionId : "X6US3HWqzzhueTOwuJ4w",
            selectedOptionIndex : 1,
            timestamp : new Date()
        })
    }
    return (
        <div>Page
            <button onClick={handler}>test</button>
        </div>
    )
}

export default Page